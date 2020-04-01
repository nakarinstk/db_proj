const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mysql = require("mysql2/promise");
const app = express();
const PORT = 5000;
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: "True" }));
app.listen(PORT, "localhost", () => console.log("listening on PORT", PORT));

const middle = (req, res, next) => {
  console.log(new Date());
  next();
};
app.use(middle);
//////////////////////////////////////////////////////
const pool = mysql.createPool({
  host: "localhost",
  user: "db_proj",
  password: "ilovedbchula",
  database: "db_proj"
});
//////////////////////////////////////////////////////
const getJson = async obj_ => {
  _list = await [];
  for (i of obj_.keys()) {
    _dict = await {};
    for (key_ in obj_[i]) {
      _dict[key_] = await obj_[i][key_];
    }
    await _list.push(_dict);
  }
  return await _list;
};
//SELECT METHOD//
//////////////////////////////////////////////////////
//tested
app.post("/getUserBook", async (req, res) => {
  try {
    if (!req.body.username) {
      res.status(403).send("Username not found.");
    } else {
      result = await pool.query(
        `select bookID,bookName,author,bookPrice,numberAvailable from book left join category on book.bookID = category.fk_cat_bookID where fk_book_username= "${req.body.username}";`
      );
      json_ = await getJson(result[0]);
      await res.send(json_);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
//////////////////////////////////////////////////////
//tested
app.get("/getAllBook", async (req, res) => {
  try {
    result = await pool.query(
      `select bookID,bookName,author,bookPrice,fk_book_username,numberAvailable from book left join category on book.bookID = category.fk_cat_bookID;`
    );
    json_ = await getJson(result[0]);
    await res.send(json_);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
//////////////////////////////////////////////////////
//tested
app.post("/checkStock", async (req, res) => {
  try {
    if (!req.body.bookID || !req.body.username) {
      res.status(403).send("Invalid Parameter");
    } else {
      result = await pool.query(
        `select numberAvailable from category where fk_cat_bookID = "${req.body.bookID}" and fk_cat_username="${req.body.username}"`
      );
      json_ = await getJson(result[0]);
      await res.send(json_);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
//////////////////////////////////////////////////////
//tested
app.post("/getUserBalance", async (req, res) => {
  try {
    if (!req.body.username) {
      res.status(403).send("Username not found.");
    } else {
      _username = await req.body.username;
      result = await pool.query(
        `select balance from customer where username = "${_username}";`
      );
      rows = await getJson(result[0]);
      try {
        await res.json([{ balance: parseFloat(rows[0]["balance"]) }] || 0);
      } catch (error) {
        await res.status(200).send("Username not found.");
      }
    }
  } catch (error) {
    console.log(error);
    res.send(500).status(error);
  }
});
//////////////////////////////////////////////////////
//tested
app.post("/login", async (req, res) => {
  try {
    if (!req.body.usr || !req.body.pwd) {
      res.status(403).send("Invalid username or password.");
    } else {
      result = await pool.query(
        `select * from customer where username =  "${req.body.usr}" and pwd = "${req.body.pwd}"`
      );
      rows = await getJson(result[0]);
      if (rows.length == 1) {
        res.status(200).send("pass");
      } else {
        res.status(400).send("fail");
      }
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
//////////////////////////////////////////////////////
//INSERT METHOD//
//////////////////////////////////////////////////////
//tested
app.post("/register", async (req, res) => {
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
      result = await pool.query(
        `select * from customer where username = "${req.body.username}"`
      );
      rows = await getJson(result[0]);
      if (rows.length == 0) {
        // add user
        pool.query(
          `insert into customer (custFName,custLName,address,username,pwd) values("${req.body.fName}","${req.body.lName}","${req.body.address}","${req.body.username}","${req.body.pwd}");`,
          (error, rows) => {
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
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
//////////////////////////////////////////////////////
//tested
app.post("/addBook", async (req, res) => {
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
      await pool.query(
        `select * from customer where username = "${req.body.username}"`,
        (err, rows) => {
          if (rows.length == 0) {
            res.status(200).send("Username not found");
          } else {
            // check if book is already added
            pool.query(
              `select * from book where fk_book_username = "${req.body.username}" and bookName="${req.body.bookName}"`,
              (err, rows) => {
                if (rows.length != 0) {
                  res.status(200).send("Book is already added.");
                } else {
                  //adding new book
                  pool.query(
                    `insert into book (bookName,fk_book_username,author,bookPrice) values("${req.body.bookName}","${req.body.username}","${req.body.author}","${req.body.bookPrice}");`,
                    (error, rows) => {
                      if (error) {
                        throw error;
                      }
                      // get book id
                      pool.query(
                        `select bookID from book where bookName = "${req.body.bookName}" and fk_book_username = "${req.body.username}"`,
                        async (error, rows) => {
                          if (error) {
                            throw error;
                          }
                          _bookID = await rows[0]["bookID"];
                          // adding to category
                          await pool.query(
                            `INSERT INTO category (fk_cat_bookID,numberAvailable, fk_cat_username) VALUES ("${_bookID}", "${req.body.amount}", "${req.body.username}");`,
                            (err, rows) => {
                              if (err) {
                                throw error;
                              }
                              res.status(200).send("Done: book added.");
                            }
                          );
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
  }
});
//////////////////////////////////////////////////////
//tested
app.post("/order", async (req, res) => {
  // check valid parameters
  if (!req.body.bookID || !req.body.buyerUsername || !req.body.payment) {
    res.status(403).send("Not enough parameters.");
  } else {
    //create new variables
    _buyerUsername = req.body.buyerUsername;
    _payment = parseInt(req.body.payment);
    _date = new Date();
    _bookList = req.body.bookID; // INPUT SHOULD BE LIST ONLY
    _isAllBookAvailable = true;
    _isBuyerUsernameExits = true;
    _isEnoughMoney = true;
    _Price = [];
    _newNumberAvailable = [];
    _totalPrice = 0;
    _newBuyerBalance = 0;
    _buyerBalance = 0;
    _seller = {};
    _sellerUsername = [];
    try {
      //check if all the books is available
      for (_bookID of _bookList) {
        result = await pool.query(
          `select * from category left join book on bookID = fk_cat_bookID where fk_cat_bookID = "${_bookID}";`
        );
        rows = await getJson(result[0]);
        _numberAvailable = await rows[0]["numberAvailable"];
        _newNumberAvailable.push(parseInt(await _numberAvailable) - 1);
        __price = await parseFloat(rows[0]["bookPrice"]);
        _Price.push([
          await rows[0]["fk_cat_username"],
          await parseFloat(__price)
        ]);
        _totalPrice += await __price;
        _seller[await rows[0]["fk_cat_username"]] = 0;
        _sellerUsername.push(await rows[0]["fk_cat_username"]);
        if (_numberAvailable < 1) {
          _isAllBookAvailable = false;
        }
      }
      if (await !_isAllBookAvailable) {
        await res.status(403).send("some book is not enough.");
      } else {
        //1. Check if buyer has enough money
        _ = await pool.query(
          `select balance from customer where username = "${_buyerUsername}"`
        );
        __ = await getJson(_[0]);
        //1.1 check if buyer username is exits
        if (__.length != 1) {
          _buyerBalance = await -1;
          _isBuyerUsernameExits = await false;
        } else {
          _buyerBalance = await __[0]["balance"];
        }
        //1.2 check if buyer has enough money
        if (_buyerBalance < _totalPrice) {
          _isEnoughMoney = false;
        }
        if (!_isBuyerUsernameExits || !_isEnoughMoney) {
          res.status(403).send("invalid buyer");
        } else {
          // 2. get seller Balance
          for ([key, _balance] of Object.entries(_seller)) {
            result = await pool.query(
              `select balance from customer where username = "${key}";`
            );
            rows = await getJson(result[0]);
            _seller[key] = await parseFloat(rows[0]["balance"]);
          }
          // 2.1 calculate new seller balance
          for (_list of _Price) {
            _seller[_list[0]] += parseFloat(_list[1]);
          }
          // 2.2 calculate new buyer balance when pay with cash
          if (_payment == 1) {
            _newBuyerBalance = _buyerBalance - _totalPrice;
          }
          // 3 start transaction
          // 3.1 change balance of buyer
          await pool.query(
            `UPDATE customer SET balance = "${_newBuyerBalance}" WHERE username = "${_buyerUsername}";`
          );
          // 3.2 change balance of each seller
          for ([key, _balance] of Object.entries(_seller)) {
            result = await pool.query(
              `UPDATE customer SET balance = "${_balance}" WHERE username = "${key}";`
            );
          }
          // 3.3 for each book
          for (i of _bookList.keys()) {
            // 3.3.1 decrease book amount in category
            result = await pool.query(
              `UPDATE category SET numberAvailable = "${_newNumberAvailable[i]}"
              WHERE fk_cat_bookID = "${_bookList[i]}";`
            );
            // 3.3.2 create record in order table
            result = await pool.query(
              `insert into orderlist (fk_payID,fk_bookID,fk_buyer_username,fk_seller_username) values ("${_payment}","${_bookList[i]}","${_buyerUsername}","${_sellerUsername[i]}");`
            );
          }
          await res.sendStatus(200);
        }
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  }
});
//////////////////////////////////////////////////////
// UPDATE METHOD//
//////////////////////////////////////////////////////
//tested
app.post("/updateBalance", async (req, res) => {
  try {
    if (!req.body.username || !req.body.addedBalance) {
      await res.status(403).send("Forbidden");
    }
    await pool.query(
      `select balance from customer where username="${req.body.username}"`,
      async (err, rows) => {
        if (err) {
          throw err;
        }
        _oldBalance = await rows[0]["balance"];
        _newBalance =
          (await parseFloat(_oldBalance)) + parseFloat(req.body.addedBalance);
        await pool.query(
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
  }
});
//////////////////////////////////////////////////////
// DROP METHOD//
//tested
app.post("/deleteBook", async (req, res) => {
  try {
    if (!req.body.bookID) {
      res.status(403).send("No book id found.");
    } else {
      pool.query(
        `delete from category where fk_cat_bookID="${req.body.bookID}"`,
        (err, rows) => {
          if (err) {
            throw err;
          }
          pool.query(
            `delete from book where bookID="${req.body.bookID}"`,
            (err, rows) => {
              if (err) {
                throw err;
              }
              res.status(200).send("Deleted.");
            }
          );
        }
      );
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
