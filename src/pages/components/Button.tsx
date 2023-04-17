export const Button = (props: { onClick: React.MouseEventHandler<HTMLDivElement>; children: JSX.Element | string }) => {
  const { onClick, children } = props;
  return (
    <div className="cursor-pointer p-1 text-2xl hover:bg-slate-800" onClick={onClick} tabIndex={0}>
      {children}
    </div>
  );
};
