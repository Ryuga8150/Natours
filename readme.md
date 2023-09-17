# Natours Application

Built using modern technologies:node.js, express, mongoDB, mongoose and friends 😄

## Removed Config.env
Create a file Config.env with this 

```
NODE_ENV=development  
DATABASE=<YOUR_DATABASE_URL>  
DATABASE_LOCAL=mongodb://localhost:27017/natours  
DATABASE_PASSWORD=<YOUR_DATABASE_PASSWORD>  
PORT=3000  
  
JWT_SECRET=<YOUR_JWT_SECRET>  
JWT_EXPIRES_IN=<JWT_EXPIRATION_DAY>d  
JWT_COOKIE_EXPIRES_IN=<COOKIE_EXPIRES_IN>   
  
EMAIL_USERNAME=<YOUR_EMAIL_USERNAME>  
EMAIL_PASSWORD=<YOUR_PASSWORD_USERNAME>  
EMAIL_HOST=sandbox.smtp.mailtrap.io   
EMAIL_PORT=25  
EMAIL_FROM=<SENDER_EMAIL>  
STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>  
```
