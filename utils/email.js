const nodemailer = require('nodemailer');
const pug = require('pug');
//const htmlToText  = require('html-to-text');
const { convert } = require('html-to-text');
//The below email sender is notb able to take in many options
//so we will build it differly now
// const sendEmail = async (options) => {
//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST, //for gmail: 'Gmail'
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     //Activate in gmail "less secure app" option
//     //Rememver GMail is not a good production app
//     //If use you are more likely to get a tag of spammer
//   });

//   // 2) Define the email options
//   const mailOptions = {
//     from: 'Paras Rawat <hello@jonas.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     //html:   // will use it later
//   };

//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

//the idea is that wehenever we want to send Emails we import this class and use it
//like new Email(user,url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Paras Rawat <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    //we want different productions in Production and In development
    // In production we want to send reakl emails
    //which we will achieve by sendGrid
    //In development we want to use our mailtrap application

    if (process.env.NODE_ENV === 'production') {
      //sendGrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST, //for gmail: 'Gmail'
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //Activate in gmail "less secure app" option
      //Rememver GMail is not a good production app
      //If use you are more likely to get a tag of spammer
    });
  }
  //send the actual email
  async send(template, subject) {
    //1) Render HTML based on a pug template
    //Untilm this point we have only used pug to create a teplate
    //and then we pass the name of the template
    //res.render('name');
    //which basically create the HTML based on the pug template
    //and then send it to the client

    //Now ,in this case we don't really want to render all we want to do is to basically create the HTML
    //out of the templates so that we can then send that HTML as the email
    //thus defining it here as an HTML OPTION

    //thus we have pug to generate this HTML email
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    //2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      //text: htmlToText.fromString(html),
      text: convert(html),
    };
    //3) Create a transport and send email

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Wecome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token only valid for 10 minutes'
    );
  }
};
