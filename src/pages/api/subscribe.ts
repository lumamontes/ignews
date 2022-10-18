import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { query as q } from 'faunadb';
import { stripe } from '../../services/stripe';
import { fauna } from '../../services/fauna';

type User = {
    ref: {
        id: string;
    };
    data: {
        stripe_customer_id: string;
    };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const session = await getSession({ req });

        const user = await fauna.query<User>(
            q.Get(q.Match(q.Index('user_by_email'), q.Casefold(session.user.email)))
        );

        let customerId = user.data.stripe_customer_id;

        if (!customerId) {
            const stripeCustomer = await stripe.customers.create({
                email: session.user.email,
                //metadata
            });

            await fauna.query(
                q.Update(q.Ref(q.Collection('users'), user.ref.id), {
                    data: {
                        stripe_customer_id: stripeCustomer.id,
                    },
                })
            );

            customerId = stripeCustomer.id;
        }

        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            success_url: process.env.STRIPE_SUCESS_URL,
            cancel_url: process.env.STRIPE_CANCEL_URL,
            billing_address_collection: 'required',
            payment_method_types: ['card'],
            line_items: [
                { price: 'price_1LFTTiBjzKnNz4ZIrN6aqTux', quantity: 1 }
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
        })
        return res.status(200).json({ sessionId: stripeCheckoutSession.id })
    } else {
        console.log('err');
        res.setHeader('Allow', 'POST');
        res.status(404).end('Method not allowed')
    }
}