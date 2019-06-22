const http = require('http')
const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const Sentiment = require('sentiment');
let sentiment = new Sentiment();
app.use(express.static('public'))
app.use(express.json())
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({ extended: true })); 
const uuidv4 = require('uuid/v4')
/* uuidv4 will be used for session auth and generation */

const mysql = require('mysql')

const sendEmail = require('./controllers/nodemailer')



/* Database Connection */
var db_config = {
    host: 'remotemysql.com',
      user: 'bSfcNzHulf',
      password: "MHjb4DXRBx",
      database: "bSfcNzHulf",
  };

  var con

  function handleDisconnect() {
    con = mysql.createConnection(db_config);

    con.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
          console.log('error when connecting to db:', err);
          setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }
        else console.log("SQL DB CONNECTION SUCCESS")                                     // to avoid a hot loop, and to allow our node script to
      });     

      con.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
          handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
          throw err;                                  // server variable configures this)
        }
      });
    }

    handleDisconnect();

let current_uuid = uuidv4();

let server = http.createServer(app)

let SOCKET



var io = require('socket.io')(server);

io.on('connection',function(socket){
    console.log("New Client has Connected")
    SOCKET = socket
    
})

function generateNewUUID(socket){
    current_uuid = uuidv4()
    socket.emit('new_uuid',current_uuid);    
}

app.get('/',(req,res)=>{


    con.query("SELECT STARS FROM REVIEWS WHERE 1;", function(err,result){
        
        if(err) console.log(err)
        else {
            
            total = 0;
            result.forEach( review => {
                console.log(review.STARS)
                total = total + review.STARS
            })

            let average = (total/result.length).toFixed(2); 
             

             let info = { value : current_uuid, rating:average}
         
         
             res.render('index',{info:info})
            
        }
    })

   
})




app.get('/render',(req,res)=>{

    

    
    if(req.query.session === current_uuid){
        /* render menu */
        generateNewUUID(SOCKET);
        res.header('session_id',req.query.session).render(__dirname+`/public/website/index.ejs`,{session:req.query.session})
    }

    else {
        res.send(`<h3 style="color:red">Invalid Session</h3> <h2> Rescan the QRCODE </h2>`)
    }
})

app.get('/initorder',(req,res)=>{
    console.log(req.query.order)
    res.render("register",{order:req.query.order})
    

})

app.post('/order',(req,res,next)=>{
    
    order_array = JSON.parse(req.body.order)
    let session = order_array.pop()

    

    
    con.query(`INSERT INTO REVIEWS VALUES("${req.body.name}","${req.body.email}","null",0,'${session.session}','${JSON.stringify(order_array)}',${req.body.phone});`,function(err,result){
        if(err){console.log(err)}
        else {  console.log("Entry Added - with name :" + req.body.name)
        sendEmail(req.body.name,req.body.email,session.session) 
    }
      
    })


    
    res.render("success",{user : req.body.name})
})

app.get("/review",(req,res)=>{
    let session = req.query.id;
	


    con.query(`SELECT * from REVIEWS WHERE SESSION_ID="${session}"`,function(err,result){
        if(err) console.log(err)
        else{
            if(!result[0]){
                res.send("Youre Messing it Up!")
            }
            else {
                
                res.render("review",info=result[0])
            }

        }
    })

})

app.post("/review",(req,res)=>{
    console.log(req.body)
    let result = sentiment.analyze(`${req.body.review}`);
    let stars = result.comparative*10

    if(stars > 5) {
        stars = 5;
    }

    if(stars < -4){
        stars = -4;
    }
    con.query(`UPDATE REVIEWS SET STARS=${stars/2},REVIEW="${req.body.review}" WHERE SESSION_ID="${req.body.session}"`,function(err,result){
        if(err){
            console.log(err)
        }
        else console.log("Review Added")
        res.send("Your feedback has been saved with us. Thank You for your time.")

        SOCKET.emit('new_ratings',"update UI");
    })
   
})

app.get("/reviews",(req,res)=>{
    let html = ""



    con.query("SELECT * FROM REVIEWS",function (err,result){
        result.forEach(review => {
            html = html + `<div> <h5> ${review.NAME} </h5> <h4> STARS : ${review.STARS} </h4>  <p> ${review.REVIEW} </p> </div>`
        });

        res.send(html)
    })


})

server.listen(80)
