export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="m-0 text-center text-sm text-[#a23737]" role="alert">
      {message}
    </p>
  );
}
