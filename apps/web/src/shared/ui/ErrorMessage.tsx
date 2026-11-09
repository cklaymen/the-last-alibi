export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="mt-3.5 text-[.78rem] leading-normal text-danger" role="alert">
      {message}
    </p>
  );
}
