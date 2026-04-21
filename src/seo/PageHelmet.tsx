import { Helmet } from 'react-helmet-async';
import { getSiteUrl } from '../lib/siteUrl';

export type PageHelmetProps = {
  title: string;
  description: string;
  path: string;
};

export function PageHelmet({ title, description, path }: PageHelmetProps) {
  const base = getSiteUrl();
  const pathSuffix = path === '/' ? '' : path;
  const url = `${base}${pathSuffix}` || path;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
