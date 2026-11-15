export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="m-0 text-center text-sm text-danger" role="alert">
      {message}
    </p>
  );
}
