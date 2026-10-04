import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});