import { ScrapflyClient, ScrapeConfig } from 'scrapfly-sdk'; // Importation ESM
import * as cheerio from 'cheerio'; // Cheerio en mode ESM
import {promises as fs} from 'fs'
import { get } from 'http';


const client = new ScrapflyClient({ key: "scp-live-16fa9b3d22254f39a840c7170e2a789f" });

async function getAveragePriceLBC(url){
    try {
        let scrape_result = await client.scrape(
            new ScrapeConfig({
                url: url,
                render_js: true,
                asp: true, 
                country: "FR"
            })
        );
        if (scrape_result.result.success) {
            const page_content = scrape_result.result.content;
            const $ = cheerio.load(page_content);
            let prices = [];
            $('span[data-qa-id="aditem_price"]').each((i, element) => {
                let priceText = $(element).text().trim();
                let price = parseInt(priceText.replace(/\D/g, ''));
                if (!isNaN(price)) {
                    prices.push(price);
                }
            });
            if (prices.length > 0) {
                let total = prices.reduce((acc, price) => acc + price, 0);
                let averagePrice = total / prices.length;
                console.log(`Le prix moyen est sur LBC : ${averagePrice.toFixed(2)}€ sur ${prices.length} annonces`);
                return averagePrice;
            } else {
                console.log("Aucun prix n'a été trouvé.");
            }
        } else {
            console.error("Erreur lors du scraping :", scrape_result.result.log_url);
        }
    } catch (error) {
        console.error("Erreur lors de l'exécution :", error);
    }
}

async function getAveragePriceAutoScout24(url) {
  try {
      let scrape_result = await client.scrape(
          new ScrapeConfig({
              url: url,
              render_js: true,  
              asp: true,       
              country: "FR"
          })
      );

      if (scrape_result.result.success) {
          const page_content = scrape_result.result.content;
          await fs.writeFile('result.txt', page_content, 'utf8');
          const $ = cheerio.load(page_content);
          const jsonScript = $('script[id="__NEXT_DATA__"]').html();
          let data = JSON.parse(jsonScript);

          if (data) {
              let prices = [];
              const itemList = data.props.pageProps.listings;

              itemList.forEach(item => {
                  if (item.tracking) {
                      let price = parseFloat(item.tracking.price);
                      if (!isNaN(price)) {
                          prices.push(price);
                      }
                  }
              });

              if (prices.length > 0) {
                  const total = prices.reduce((acc, price) => acc + price, 0);
                  const averagePrice = total / prices.length;
                  console.log(prices)
                  console.log(`Le prix moyen est : ${averagePrice.toFixed(2)} € pour ${prices.length} annonces.`);
                  return averagePrice;
              } else {
                  console.log("Aucun prix n'a été trouvé dans les offres.");
              }
          } else {
              console.log("Aucune offre n'a été trouvée dans les données JSON.");
          }
      } else {
          console.error("Erreur lors du scraping :", scrape_result.result.log_url);
      }
  } catch (error) {
      console.error("Erreur lors de l'exécution :", error);
  }
}


const pricelbc = await getAveragePriceLBC('https://www.leboncoin.fr/recherche?category=2&shippable=0&u_car_brand=PORSCHE&u_car_model=PORSCHE_Cayman&fuel=1&gearbox=1&horse_power_din=280-max&regdate=2005-2007&mileage=95000-105000&owner_type=all')
const priceAuto24 = await getAveragePriceAutoScout24("https://www.autoscout24.fr/lst/audi/s3?atype=C&cy=F&desc=0&fregfrom=2015&fregto=2016&kmfrom=90000&kmto=100000&powertype=kw&search_id=k82ztjcopm&sort=standard&source=detailsearch&ustate=N%2CU")

