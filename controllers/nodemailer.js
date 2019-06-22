

const nodemailer = require('nodemailer');

function sendPassInfo(userName,userEmail,session_id){

  

    let transporter = nodemailer.createTransport({
        host: "mail.cseiust.in",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
         user: "admin@cseiust.in", // generated ethereal user
         pass: "root@123#$&" // generated ethereal password
        }
    });
    
   

    


    // setup email data with unicode symbols
    let mailOptions = {
        from: 'REVIEW SYSTEM | IUST <admin@cseiust.in>', // sender address
        to: userEmail, // list of receivers
        subject: 'DOCSE, IUST', // Subject line

        html: `Thank You for ordering food with us. We are hopeful that you like our service. Please take a moment in leaving your valuable feedback here  http://cse.openode.io/review?id=${session_id}`, // html body

    };
    
    //send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
        
    })
}

module.exports = sendPassInfo;
