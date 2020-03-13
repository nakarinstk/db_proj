const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mysql = require("mysql");
const app = express();
const PORT = 5000;
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: "True" }));
app.listen(PORT, "localhost", () => console.log("listening on PORT", PORT));
//////////////////////////////////////////////////////
const pool = mysql.createPool({
  host: "localhost",
  user: "db_proj",
  password: "ilovedbchula",
  database: "db_proj"
});
//////////////////////////////////////////////////////
//SELECT METHOD//
//////////////////////////////////////////////////////
//tested
app.post("/getBook", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      if (!req.body.username) {
        res.status(403).send("Username not found.");
      } else {
        await db.query(
          `select "bookID","bookName","author","bookPrice" from book where fk_book_username= "${req.body.username}"`,
          (err, rows) => {
            if (err) {
              throw err;
            }
            res.json(rows);
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.get("/getAllBook", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      await db.query(
        `select bookID,bookName,author,bookPrice,fk_book_username,numberAvailable from book left join category on book.bookID = category.fk_cat_bookID;`,
        (err, rows) => {
          if (err) {
            throw err;
          }
          res.json(rows);
        }
      );
    } catch (error) {
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.post("/checkStock", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      await db.query(
        `select numberAvailable from category where fk_cat_bookID = "${req.body.bookID}" and fk_cat_username="${req.body.username}"`,
        (err, rows) => {
          if (err) {
            throw err;
          }
          res.json(rows);
        }
      );
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.get("/getAllUser", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      await db.query(`select * from customer`, (err, rows) => {
        if (err) {
          throw err;
        }
        res.json(rows);
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.post("/getUserBalance", async (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      if (!req.body.username) {
        res.status(403).send("Username not found.");
      } else {
        _username = await req.body.username;
        await db.query(
          `select balance from customer where username = "${_username}";`,
          (err, rows) => {
            if (err) {
              throw err;
            }
            try {
              res.json(rows[0]["balance"] || 0);
            } catch (error) {
              res.status(200).send("Username not found.");
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.send(500).status(error);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.post("/login", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      if (!req.body.usr || !req.body.pwd) {
        res.status(200).send("Invalid username or password.");
      } else {
        await db.query(
          `select * from customer where username =  "${req.body.usr}" and pwd = "${req.body.pwd}"`,
          (err, rows) => {
            if (rows.length == 1) {
              res.status(200).send("pass");
            } else {
              res.status(400).send("fail");
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//INSERT METHOD//
//////////////////////////////////////////////////////
//tested
app.post("/register", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      // check valid parameters
      if (
        !req.body.fName ||
        !req.body.lName ||
        !req.body.username ||
        !req.body.pwd ||
        !req.body.address
      ) {
        await res.status(403).send("Forbidden: Not enough parameters.");
      } else {
        // check if username is exits
        await db.query(
          `select * from customer where username = "${req.body.username}"`,
          (err, rows) => {
            if (rows.length == 0) {
              // add user
              db.query(
                `insert into customer (custFName,custLName,address,username,pwd) values("${req.body.fName}","${req.body.lName}","${req.body.address}","${req.body.username}","${req.body.pwd}");`,
                (err, rows) => {
                  if (error) {
                    throw error;
                  }
                  res.status(200).send("Done: user added.");
                }
              );
            } else {
              res.status(200).send("This username is already taken.");
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.post("/addBook", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      // check valid parameters
      if (
        !req.body.bookName ||
        !req.body.author ||
        !req.body.bookPrice ||
        !req.body.username ||
        !req.body.amount
      ) {
        await res.status(403).send("Not enough parameters.");
      } else {
        // check if username is exits
        await db.query(
          `select * from customer where username = "${req.body.username}"`,
          (err, rows) => {
            if (rows.length == 0) {
              res.status(200).send("Username not found");
            } else {
              // check if book is already added
              db.query(
                `select * from book where fk_book_username = "${req.body.username}" and bookName="${req.body.bookName}"`,
                (err, rows) => {
                  if (rows.length != 0) {
                    res.status(200).send("Book is already added.");
                  } else {
                    //adding new book
                    db.query(
                      `insert into book (bookName,fk_book_username,author,bookPrice) values("${req.body.bookName}","${req.body.username}","${req.body.author}","${req.body.bookPrice}");`,
                      (error, rows) => {
                        if (error) {
                          throw error;
                        }
                        // get book id
                        db.query(
                          `select bookID from book where bookName = "${req.body.bookName}" and fk_book_username = "${req.body.username}"`,
                          async (error, rows) => {
                            if (error) {
                              throw error;
                            }
                            _bookID = await rows[0]["bookID"];
                            // adding to category
                            await db.query(
                              `INSERT INTO category (fk_cat_bookID,numberAvailable, fk_cat_username) VALUES ("${_bookID}", "${req.body.amount}", "${req.body.username}");`,
                              (err, rows) => {
                                if (err) {
                                  throw error;
                                }
                              }
                            );
                            await res.status(200).send("Done: book added.");
                          }
                        );
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.post("/order", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      // check valid parameters
      if (!req.body.bookID || !req.body.buyerUsername || !req.body.payment) {
        await res.status(200).send("Not enough parameters.");
      } else {
        //create new variables
        _buyerUsername = req.body.buyerUsername;
        _payment = req.body.payment;
        _amount = 1;
        _date = new Date();
        _list = JSON.parse(req.body.bookID); // INPUT SHOULD BE LIST ONLY
        //Loop through each bookID
        await _list.forEach(async _bookID => {
          // check if username and book exits and has book more than one.
          await db.query(
            `select * from category left join book on bookID = fk_cat_bookID where fk_cat_bookID = "${_bookID}"`,
            async (err, rows) => {
              if (err) {
                throw err;
              }
              _numberAvailable = await rows[0]["numberAvailable"];
              _newNumberAvailable = (await _numberAvailable) - _amount;
              _price = await rows[0]["bookPrice"];
              _sellerUsername = await rows[0]["fk_cat_username"];
              if (_numberAvailable < _amount) {
                res.status(200).send("not enough book");
              }
            }
          );
          //check if both users exits
          await db.query(
            `select * from customer where username = "${_buyerUsername}";`,
            (err, rows) => {
              if (err) {
                throw err;
              }
              _numberofusers = rows.length;
              if (_numberofusers != 1) {
                res.status(200).send("buyer users not exits.");
              }
            }
          );
          //create order
          //1. if pay with cash -> delete from balance else creditcard:pass
          await db.query(
            `select balance from customer where username = "${_buyerUsername}"`,
            async (err, rows) => {
              if (err) {
                throw err; //@1
              }
              _balance = await rows[0]["balance"];
              if (_balance < _price) {
                res.status(200).send("Not enough balance for buyer.");
              } else {
                // if pay with cash
                if (parseInt(_payment) == 1) {
                  _newBalance = (await _balance) - _price;
                  // console.log("Price :" + _price);
                  // console.log("New balance : " + _newBalance);
                  //2.change balance for buyer
                  await db.query(
                    `UPDATE customer SET balance = "${_newBalance}" WHERE username = "${_buyerUsername}";`,
                    (err, rows) => {
                      if (err) {
                        throw err; //@2
                      }
                    }
                  );
                }
                //else pay with credit
                //3.decrese book amount from category
                await db.query(
                  `UPDATE category SET numberAvailable = "${_newNumberAvailable}" WHERE fk_cat_bookID = "${_bookID}";
`,
                  (err, rows) => {
                    if (err) {
                      throw err; // @3
                    }
                    //4.insert record to order table
                    db.query(
                      `insert into orderlist (fk_payID,fk_bookID,fk_buyer_username,fk_seller_username) values ("${_payment}","${_bookID}","${_buyerUsername}","${_sellerUsername}");`,
                      (err, rows) => {
                        if (err) {
                          throw err; // @4
                        }
                      }
                    );
                  }
                );
              }
            }
          );
        });
        await res.status(200).send("Done: order added.");
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
// UPDATE METHOD//
//////////////////////////////////////////////////////
//tested
app.post("/updateBalance", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      if (!req.body.username || !req.body.addedBalance) {
        await res.status(403).send("Forbidden");
      }
      await db.query(
        `select balance from customer where username="${req.body.username}"`,
        async (err, rows) => {
          if (err) {
            throw err;
          }
          _oldBalance = await rows[0]["balance"];
          _newBalance =
            (await parseFloat(_oldBalance)) + parseFloat(req.body.addedBalance);
          await db.query(
            `update customer set balance = "${_newBalance}" where username = "${req.body.username}"`,
            (err, rows) => {
              if (err) {
                throw err;
              }
              res.status(200).send("success.");
            }
          );
        }
      );
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
//////////////////////////////////////////////////////
//tested
app.post("/acceptOrder", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      if (!req.body.orderID) {
        await res.status(200).send("orderID not found");
      }
      // change to true in orderlist
      await db.query(
        `UPDATE orderlist SET shipping_status = "1" WHERE orderID="${req.body.orderID}";
`,
        async (err, rows) => {
          if (err) {
            throw err;
          }
        }
      );
      // add money to seller
      await db.query(
        `select fk_seller_username,bookPrice,balance from orderlist left join book on fk_bookID = bookID
        left join customer on fk_seller_username = username;`,
        async (err, rows) => {
          if (err) {
            throw err;
          }
          _price = await parseFloat(rows[0]["bookPrice"]);
          _sellerUsername = await rows[0]["fk_seller_username"];
          _oldBalance = await parseFloat(rows[0]["balance"] || 0);
          _newBalance = (await _oldBalance) + _price;
          // console.log("oldBalance: " + _oldBalance);
          // console.log("price: " + _price);
          // console.log("newBalance: " + _newBalance);
          await db.query(
            `update customer set balance = "${_newBalance}" where username = "${_sellerUsername}"`,
            (err, rows) => {
              if (err) {
                throw err;
              }
              res.status(200).send("added money to seller");
            }
          );
        }
      );
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    } finally {
      db.release();
    }
  });
});
// DROP METHOD//
//tested
app.post("/deleteBook", (req, res) => {
  pool.getConnection(async (error, db) => {
    try {
      if (!req.body.bookID) {
        await res.status(200).send("No book id found.");
      }
      await db.query(
        `delete from category where fk_cat_bookID="${req.body.bookID}"`,
        (err, rows) => {
          if (err) {
            throw err;
          }
        }
      );
      await db.query(
        `delete from book where bookID="${req.body.bookID}"`,
        (err, rows) => {
          if (err) {
            throw err;
          }
        }
      );
      res.status(200).send("Deleted.");
      await db.release();
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });
});
