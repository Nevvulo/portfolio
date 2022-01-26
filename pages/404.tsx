import { Title, Text, Link, StrippedLink } from "../components/generics";
import { MinimalView } from "../components/layout/minimal";
import { ROUTES } from "../constants/routes";

export default function NotFound() {
  return (
    <MinimalView>
      <Title>Oops!</Title>
      <Text>We couldn't what you were looking for.</Text>
      <Link href={ROUTES.ROOT}>Back to the homepage</Link>
    </MinimalView>
  );
}
