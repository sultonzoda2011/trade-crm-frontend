import ErrorPage from '~/components/shared/ErrorPage';

export default function ForbiddenRoute() {
  return (
    <ErrorPage
      code="403"
      icon="shield"
      titleKey="pages.forbidden.title"
      descriptionKey="pages.forbidden.description"
      backHomeKey="pages.forbidden.backHome"
    />
  );
}
