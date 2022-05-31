import React, {ReactNode} from 'react';
import Head from 'next/head';
import Link from 'next/link';

type Props = {
  children?: ReactNode;
  title?: string;
};

const Layout = ({children, title = 'This is the default title'}: Props) => (
  <div>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    {children}
    <footer className="flex flex-col items-center border-t border-gray-500 py-4 mt-4">
      <hr />
      <div>All rights reserved</div>
      <div>Code Gino</div>
    </footer>
  </div>
);

export default Layout;
