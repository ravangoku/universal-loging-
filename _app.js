import '../styles/globals.css';
import { useEffect } from 'react';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (!document.documentElement.classList.contains('dark')) document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Universal Logging System</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
