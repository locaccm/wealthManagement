import express from 'express';
import accommodationRouter from './routes/accommodation.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/createAccommodations', accommodationRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
