/** Server ack error for a command (role=alert). Renders nothing without an error. */
export function CommandError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="m-0 text-sm text-danger">
      {message}
    </p>
  );
}
