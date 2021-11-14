const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_hotels",
  password: "195319",
  port: 5432,
});

app.get("/hotels", function (req, res) {
  pool
    .query("SELECT * FROM hotels")
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.post("/hotels", function (req, res) {
  const newHotelName = req.body.name;
  const newHotelRooms = req.body.rooms;
  const newHotelPostcode = req.body.postcode;

  if (!Number.isInteger(newHotelRooms) || newHotelRooms <= 0) {
    return res
      .status(400)
      .send("The number of rooms should be a positive integer.");
  }

  pool
    .query("SELECT * FROM hotels WHERE name=$1", [newHotelName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An hotel with the same name already exists!");
      } else {
        const query =
          "INSERT INTO hotels (name, rooms, postcode) VALUES ($1, $2, $3)";
        pool
          .query(query, [newHotelName, newHotelRooms, newHotelPostcode])
          .then(() => res.send("Hotel created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerEmail = req.body.email;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerPostcode = req.body.postcode;
  const newCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customers with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, email, address, city, postcode, country) VALUES ($1, $2, $3, $4, $5, $6)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerEmail,
            newCustomerAddress,
            newCustomerCity,
            newCustomerPostcode,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.get("/hotels/:hotelId", function (req, res) {
  const hotelId = req.params.hotelId;

  pool
    .query("SELECT * FROM hotels WHERE id=$1", [hotelId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/customers-order", function (req, res) {
  pool
    .query("SELECT * FROM customers order by name asc")
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/bookings/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("select bookings.checkin_date,bookings.nights,hotels.name,hotels.postcode from  bookings join hotels on bookings.hotel_id=hotels.id and bookings.customer_id=$1;", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});


app.patch('/customers/:customerId', function (req, res) {
  let customer_id = parseInt(req.params.customerId)
  let { name, email, address, city, postcode, country } = req.body
  let values = [name, email, address, city, postcode, country, customer_id]
  const selectCustomerById = `SELECT * FROM customers WHERE id = $1`;
  const updateCustomer = `PATCH customers SET name = $1, email = $2, address = $3, city = $4, postcode = $5, country = $6 WHERE id = $7`;

  pool.connect((err, client, release) => {
      if (err) {
          res.send('Error acquiring client')
      }
      client.query(selectCustomerById, [customer_id], (err, result) => {
          if (err) {
              res.send('Error excecuting query.')
          } 
          if (result.rowCount < 1) {
              res.send('The customer with this id does not exist.')
          }
          client.query(updateCustomer, values, (err, result) => {
              res.status(201).send('The customer was updated.')
          });
      });
  });
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM bookings WHERE customer_id=$1", [customerId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

app.delete("/hotels/:hotelId", function (req, res) {
  const hotelId = req.params.hotelId;

  pool
    .query("DELETE FROM bookings WHERE hotel_id=$1", [hotelId])
    .then(() => {
      pool
        .query("DELETE FROM hotels WHERE id=$1", [hotelId])
        .then(() => res.send(`Hotel ${hotelId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
