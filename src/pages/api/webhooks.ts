import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import Stripe from 'stripe';
import { stripe } from '../../services/stripe';
import { saveSubscription } from './_lib/manageSubscription';

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false, // pq a requisicao eh uma string
  },
};

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);
// set eh array q n permite dados duplicados

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const secret = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        secret,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    const { type } = event;

    if (relevantEvents.has(type)) {
      try {
        switch (type) {
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;

            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
              false
            );

            break;

          case 'checkout.session.completed':
            const checkoutSession = event.data
              .object as Stripe.Checkout.Session;

            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            );

            break;
          default:
            throw new Error('Unhandled evet.');
        }
      } catch (err) {
        // erro pq eh um tipo de evento que nao esta sendo tratado
        // nao pode ser status de erro pq se n o stripe vai tentar executar o pagamento de novo
        return res.json({ error: 'Webhook handler failed' });
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
  }
};