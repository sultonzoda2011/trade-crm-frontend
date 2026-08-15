import ErrorPage from '~/components/shared/ErrorPage';

export default function NotFoundRoute() {
  return (
    <ErrorPage
      code="404"
      icon="file"
      titleKey="pages.notFound.title"
      descriptionKey="pages.notFound.description"
      backHomeKey="pages.notFound.backHome"
    />
  );
}
