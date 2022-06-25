import { AppProps } from 'next/app'
import Head from 'next/head'
import { Header } from '../components/Header';
import '../styles/global.scss';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
