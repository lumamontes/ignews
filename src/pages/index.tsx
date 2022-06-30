import { GetStaticProps }from 'next';

import Head from 'next/head';
import { SubscribeButton } from '../components/SubscribeButton';
import { stripe } from '../services/stripe';

import styles from './home.module.scss';

interface HomeProps {
  product: {
    priceId: string;
    amount: number;
  }
}

export default function Home({product}: HomeProps) {
  return (
    <>
      <Head>
        <title>Home | ig.news</title>
      </Head>
      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span> 👏 Hey, welcome</span>
          <h1>News about the <span>React</span> world.</h1>
          <p>
            Get acess to all the publications <br />
            <span>For {product.amount} month</span>
          </p>
          <SubscribeButton priceId={product.priceId} />
        </section>
        <img src='/images/avatar.svg' alt='Girl coding'></img>
      </main>
    </>
  )
}

//Geração de página estática, que será mostrada por todos os usuários 
//Utilizar somente em páginas que o conteúdo é o mesmo para todos os usuarios

//Client-side
//Server-side
//Static side generation

export const getStaticProps: GetStaticProps = async () => {
  const price = await stripe.prices.retrieve('price_1LFTTiBjzKnNz4ZIrN6aqTux', {
    expand: ['product']
  });
  const product = {
    priceId: price.id,
    amount: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price.unit_amount / 100)
  }
  return {
    props: {
      product,
      revalidade : 60 * 60 * 24
    },
  }
}