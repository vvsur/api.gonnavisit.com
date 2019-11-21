const process = require('process');
var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const fetch = require('node-fetch');
var Jimp = require('jimp');
const Knex = require('knex');

require('dotenv').config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};
const knex = Knex({ client: 'pg', connection: config });

const moment = require("moment")


app.use(bodyParser.json());
app.use(pino);

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-PINGOTHER,X-Requested-With,content-type');
  //res.setHeader('Access-Control-Allow-Headers', 'Overwrite, Destination, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  res.setHeader('Access-Control-Max-Age', 1000);

  // Pass to next layer of middleware
  next();
});


const serverName = process.env.IMPORT_SERVER_KG

const mockData = {

  "/event-cities": [
    { "name": 'Любой город', "name2": 'любом городе', "sysName": 'all-cities' },
    { "name": 'Москва', "name2": 'Москве', "sysName": 'msk' },
    { "name": 'Санкт-Петербург', "name2": 'Санкт-Петербурге', "sysName": 'spb' },
    { "name": 'Сочи', "name2": 'Сочи', "sysName": 'sch' },
    { "name": 'Краснодар', "name2": 'Краснодаре', "sysName": 'krd' },
    { "name": 'Казань', "name2": 'Казани', "sysName": 'kzn' },
    { "name": 'Екатеринбург', "name2": 'Екатеринбурге', "sysName": 'ekb' },
    { "name": 'Нижний Новгород', "name2": 'Нижнем Новгороде', "sysName": 'nnv' },
    { "name": 'Новосибирск', "name2": 'Новосибирске', "sysName": 'nsk' },
    { "name": 'Красноярск', "name2": 'Красноярске', "sysName": 'kry' },
  ],
  
}

function proxyReq(url, params) {

  app.get(url, function (req, res) {

    console.log('req>>>:', req.query);
    console.log('url', url);


    // req.query: {
    //   page: '1',
    //   page_size: '20',
    //   city: 'all-cities',
    //   moment: 'all-times'



    if (mockData[url]) {
      res.send({
        result: mockData[url],
        error: {}
      });
    } else {

      //console.log('>>>>>', url);

if (url === "/event-categories")
{

  (async () => {

    const dbValue = await knex("eventsCategories")
      .select(["id", "sysName", "name"])


    if (dbValue) {

      return res.send({
        result: {
          groups: dbValue,
        },
        error: {}
      });

    } else {
      return res.send({
        result: {},
        error: {}
      });

    }
    // } else {

    //   return res.send({
    //     result: {},
    //     error: {}
    //   });
    // }

  })();

} else 

////   { "id": 29, "slug": "ball", "name": "Балы (Развлечения)" },

      if (url === "/image") {


        const size = {
          small: {
            width: 100,
            height: 250
          },
          middle: {
            // width: 200,
            // height: 350
            width: 400,
            height: 550
          },
          large: {
            width: 550,
            height: 350
          }
        };


        imageSize = size.large;

        const sysName = req.query.sysname ? req.query.sysname : null;

        (async () => {

          if (sysName) {

            const arr = sysName.split('-');
            imageName = arr[arr.length - 1];

            const url = `${process.env.IMPORT_SERVER_KG_IMAGES}/${imageName}`

            //console.log(">>>>>>:", url);

            Jimp.read(url, (err, image) => {

              if (err) throw err;

              image.resize(imageSize.width, Jimp.AUTO);
              if (image.bitmap.height > imageSize.height) {
                image.resize(Jimp.AUTO, imageSize.height);
              }


              return image.getBuffer(Jimp.MIME_JPEG, function (err, buffer) {
                res.set("Content-Type", Jimp.MIME_JPEG);
                res.send(buffer);
              });

            });

          } else {

            return res.send({
              result: {},
              error: {}
            });
          }

        })();


      } else if (url === "/for-sitemap") {


        //const sysName = req.query.sysname ? req.query.sysname : null;

        (async () => {

          const dbValue = await knex("events")
            .select(["lang", "sysName", "id", "created_at", "updated_at"])
            .where("isActive", true)

          if (dbValue) {

            return res.send({
              result: {
                events: dbValue,
                groups: {},
              },
              error: {}
            });

          } else {
            return res.send({
              result: {},
              error: {}
            });

          }
          // } else {

          //   return res.send({
          //     result: {},
          //     error: {}
          //   });
          // }

        })();




      } else if (url === "/content-page-block") {

        const sysName = req.query.sysname ? req.query.sysname : null;

        (async () => {

          if (sysName) {

            //console.log('sysName', sysName);

            const dbValue = await knex("pageBlocks")
              .select(["content"])
              .where("sysName", sysName)
              .first()


            if (dbValue) {

              return res.send({
                result: {
                  ...dbValue
                },
                error: {}
              });

            } else {
              return res.send({
                result: {},
                error: {}
              });

            }
          } else {

            return res.send({
              result: {},
              error: {}
            });
          }

        })();


      } else if (url === "/content-page") {

        const sysName = req.query.sysname ? req.query.sysname : null;

        (async () => {

          if (sysName) {

            //console.log('sysName', sysName);

            const dbValue = await knex("pages")
              .select(["title", "description", "body", "keywords"])
              .where("sysName", sysName)
              .first()


            if (dbValue) {

              return res.send({
                result: {
                  ...dbValue
                },
                error: {}
              });

            } else {
              return res.send({
                result: {},
                error: {}
              });

            }
          } else {

            return res.send({
              result: {},
              error: {}
            });
          }

        })();


      } else if (url === "/event") {

        const id = req.query.id ? req.query.id : 0;


        console.log('url:', url);
        console.log('!!req>>>:', req.query);

        // switch (momentType) {
        //   case 'today':
        //     from = moment().startOf('day');
        //     to = moment().endOf('day');
        //     break;
        //   case 'tomorrow':
        //     from = moment().add(1, 'day').startOf('day');
        //     to = moment().add(1, 'day').endOf('day');
        //     break;
        //   case 'this-weekend':
        //     from = moment().endOf('week').startOf('day');
        //     to = moment().endOf('week').add(1, 'day');
        //     break;
        //   case 'this-week':
        //     from = moment().startOf('week').add(1, 'day');
        //     to = moment().endOf('week').add(1, 'day');
        //     break;
        //   case 'next-week':
        //     from = moment().add(1, 'week').startOf('week').add(1, 'day');
        //     to = moment().add(1, 'week').endOf('week').add(1, 'day');
        //     break;
        //   case 'this-month':
        //     from = moment().startOf('month');
        //     to = moment().endOf('month');
        //     break;
        //   case 'next-month':
        //     from = moment().add(1, 'month').startOf('month');
        //     to = moment().add(1, 'month').endOf('month');
        //     break;

        //   default:
        //     from = moment().startOf('day');
        //     to = moment().add(3, 'month').endOf('month');
        //     break;
        // }

        //const momentFormat = 'YYYY-MM-DD HH:mm:ss';
        // console.log("from.format(momentFormat):", from.format(momentFormat));
        // console.log("from:", from.unix());
        // console.log("to.format(momentFormat):", to.format(momentFormat));
        // console.log("to:", to.unix());
        // console.log("---");
        // console.log("from2:", moment.unix(from.unix()).format(momentFormat));
        // console.log("to2:", moment.unix(to.unix()).format(momentFormat));


        (async () => {

          if (id > 0) {

            const dbValue = await knex("events")
              .select(["id", "title", "titleShort", "sysName", "placeId", "description", "body", "city", "ageRestriction", "price", "isFree", "categories", "tags", "moments"])
              .where("id", id).first()


            const options = {
              method: 'GET',
              headers: {
                'content-type': 'application/json',
                'cookie': req.get('cookie')
              },
              credentials: 'include'
            };


            const placeData = await fetch(`${process.env.IMPORT_SERVER_KG}/places/${dbValue.placeId}`, options).then(r => r.json());

            console.log("placeData:", placeData);

            //console.log("dbValue:", dbValue);

            // select f.url 
            // FROM upload_file_morph fm
            // inner join upload_file f on f.id = fm.upload_file_id
            // where fm.related_id = events.id --limit 1


            if (dbValue) {

              let images = await knex("upload_file_morph")
                .join('upload_file', 'upload_file.id', '=', 'upload_file_morph.upload_file_id')
                .select('upload_file.url', 'upload_file.provider_metadata')
                .where("related_id", id).where("related_type", 'events');
              // if (dbValue.images) {

              //   for (const imgValues of dbValue.images) {

              //     const arr = imgValues.image.split('/');
              //     //images.push({
              //     images.unshift({
              //       ...imgValues,
              //       //image: `${dbValue.sysName}-${arr[arr.length - 1]}`
              //     });
              //   }
              // }
              // images = [];

              return res.send({
                result: {
                  ...dbValue,
                  images: images,
                  place: {
                    id: placeData.id,
                    title: placeData.title,
                    titleShort: placeData.short_title,
                    sysName: placeData.slug,
                    address: placeData.address,
                    timetable: placeData.timetable,
                    phone: placeData.phone,
                    // body: placeData.body_text,
                    // description: placeData.description,
                    // site: placeData.foreign_url,
                    coords: placeData.coords,
                    subway: placeData.subway,
                    // images: placeData.images,
                    // categories: placeData.categories,
                    // tags: placeData.tags,
                    location: placeData.location,
                    // ageRestriction: placeData.age_restriction,
                    // hasParking: placeData.has_parking_lot
                  }
                },
                error: {}
              });

            } else {

              return res.send({
                result: {},
                error: {}
              });

            }

          } else {

            return res.send({
              result: {},
              error: {}
            });
          }

          // const dbEvents = await knex.raw('SELECT * FROM getItems(?, ?, ?, ?, ?, ?)', [from.unix(), to.unix(), (city === 'all-cities') ? null : city, null, page * pageSize, pageSize]);
          // // .then(function(resp) {
          // //   console.log('Transaction complete.');
          // // }).catch(function(err) {
          // //   console.error(err);
          // // });


          // //console.log('sql: ', knex.raw(`SELECT * FROM getItems(?, ?, ?, ?, ?, ?)`, [from.unix(), to.unix(), (city === 'all-cities') ? null : city, null, page * pageSize, pageSize]).toSQL());



          // if (dbEvents) {

          //   return res.send({
          //     result: {
          //       ...dbEvents.rows[0]
          //     },
          //     error: {}
          //   });

          // } else {

          //   return res.send({
          //     result: {},
          //     error: {}
          //   });

          // }

        })();

      }
      else
        if (url === "/events") {

          let page = req.query.page ? req.query.page : 0;
          page = page - 1; if (page < 0) page = 0;
          const pageSize = req.query.page_size ? req.query.page_size : 10;
          const city = req.query.city ? req.query.city : 'all-cities';
          const momentType = req.query.moment ? req.query.moment : 'all-times';
          const group = req.query.group ? req.query.group : null;

          let from = null;
          let to = null;

          //console.log('url:', url);
          //console.log('req>>>:', req.query);

          switch (momentType) {
            case 'today':
              from = moment().startOf('day');
              to = moment().endOf('day');
              break;
            case 'tomorrow':
              from = moment().add(1, 'day').startOf('day');
              to = moment().add(1, 'day').endOf('day');
              break;
            case 'this-weekend':
              from = moment().endOf('week').startOf('day');
              to = moment().endOf('week').add(1, 'day');
              break;
            case 'this-week':
              from = moment().startOf('week').add(1, 'day');
              to = moment().endOf('week').add(1, 'day');
              break;
            case 'next-week':
              from = moment().add(1, 'week').startOf('week').add(1, 'day');
              to = moment().add(1, 'week').endOf('week').add(1, 'day');
              break;
            case 'this-month':
              from = moment().startOf('month');
              to = moment().endOf('month');
              break;
            case 'next-month':
              from = moment().add(1, 'month').startOf('month');
              to = moment().add(1, 'month').endOf('month');
              break;

            case 'past':
              from = null;
              to = null;
              break;

            default:
              from = null;
              to = null;
              break;
          }

          // const momentFormat = 'YYYY-MM-DD HH:mm:ss';
          // console.log("from.format(momentFormat):", from.format(momentFormat));
          // console.log("from:", from.unix());
          // console.log("to.format(momentFormat):", to.format(momentFormat));
          // console.log("to:", to.unix());
          // console.log("---");
          // console.log("from2:", moment.unix(from.unix()).format(momentFormat));
          // console.log("to2:", moment.unix(to.unix()).format(momentFormat));
          // console.log(">>group:", group);

          (async () => {

            const momentFormat = 'YYYY-MM-DD HH:mm:ss';

            let result = {};
            let dbValue = {};

            if (momentType === 'past') {
              dbValue = await knex.raw('SELECT * FROM get_events_past(?, ?, ?, ?)', [city === 'all-cities' ? null : city, group, page * pageSize, pageSize]);

            } else if (!from && !to) /*all-times*/ {
              dbValue = await knex.raw('SELECT * FROM get_events_current_all(?, ?, ?, ?)', [city === 'all-cities' ? null : city, group, page * pageSize, pageSize]);

            } else {
              dbValue = await knex.raw('SELECT * FROM get_events_current(?, ?, ?, ?, ?, ?)', [city === 'all-cities' ? null : city, group, page * pageSize, pageSize, from.format(momentFormat), to.format(momentFormat)]);

            }


            if (dbValue && dbValue.rows && dbValue.rows.length > 0)
            result = dbValue.rows[0];

            //console.log('dbValue: ', knex.raw('SELECT * FROM getItems(?, ?, ?, ?, ?, ?)', [from.unix(), (to) ? to.unix() : null, (city === 'all-cities') ? null : city, group, page * pageSize, pageSize]).toSQL());


            ///////////////////////



            // if (dbValue && dbValue.rows[0] && dbValue.rows[0].items) {
            //   resultItems = dbValue.rows[0].items;

            //   for (const item of resultItems) {

            //     // let image = {};
            //     // if (item.images) {

            //     //   for (const imgValues of item.images) {

            //     //     const arr = imgValues.image.split('/');
            //     //     image = {
            //     //       ...imgValues,
            //     //       //image: `${item.sysName}-${arr[arr.length - 1]}`
            //     //     };
            //     //   }
            //     // }

            //     //resultItemsNew.unshift({ ...item, images: [image] });
            //     resultItemsNew.unshift({ ...item });
            //   }

            //   //console.log("resultItems.images:", resultItems.images);
            // }

            //console.log("resultItems:", resultItems);


            //const result = { ...dbValue.rows[0], items: resultItemsNew };

            if (result) {

              return res.send({
                result: result,
                error: {}
              });

            } else {

              return res.send({
                result: {},
                error: {}
              });

            }

          })();

        } else {



          let serverUrl = serverName + req.url;

          //console.log(serverUrl);
          //console.log(req);

          // if (req.params && req.params.id) {
          //   serverUrl = serverUrl.replace(new RegExp(":id", 'g'), req.params.id);
          // }

          const options = {
            method: 'GET',
            headers: {
              'content-type': 'application/json',
              'cookie': req.get('cookie')
            },
            credentials: 'include'
          };


          //     console.log(serverUrl);
          // res.send({
          //   result: {},
          //   error: {}
          // });


          fetch(serverUrl, options)
            .then(response => {
              return response.json();
            }
            )
            .then(data => {

              res.send({
                result: data,
                error: {}
              });

            })
            .catch((error) => {
              return res.send({
                result: {},
                error: error
              });
            });

        }
    }
  })
}

proxyReq("/for-sitemap", "");

proxyReq("/content-page", "");
proxyReq("/content-page-block", "");
//proxyReq("/image", "");

//СПИСОК ГОРОДОВ
proxyReq("/event-cities", "?lang=&order_by=&fields=");
//ДЕТАЛИЗАЦИЯ ГОРОДА
proxyReq("/locations/:id", "?lang=&fields=");

//КАТЕГОРИИ СОБЫТИЙ
proxyReq("/event-categories", "?lang=&order_by=&fields=");

//КАТЕГОРИИ МЕСТ
proxyReq("/place-categories", "?lang=&order_by=&fields=");


//СПИСОК СОБЫТИЙ
proxyReq("/events", "?lang=&fields=&expand=");
//ДЕТАЛИЗАЦИЯ СОБЫТИЯ
proxyReq("/event/:id", "?lang=&fields=&expand=");
proxyReq("/event", "?lang=&fields=&expand=");

//СПИСОК СОБЫТИЙ ДНЯ
proxyReq("/events-of-the-day", "?lang=&fields=&expand=");


/////////////////////////////////
//СПИСОК МЕСТ
proxyReq("/places", "?lang=&fields=&expand=");
//ДЕТАЛИЗАЦИЯ МЕСТА
proxyReq("/places/:id", "?lang=&fields=&expand=");

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}, http://localhost:${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
