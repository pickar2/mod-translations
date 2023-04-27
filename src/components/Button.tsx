export const Button = (props: { onClick: React.MouseEventHandler<HTMLButtonElement>; children: any }) => {
  const { onClick, children } = props;
  return (
    <button
      className="cursor-pointer select-none p-1 text-2xl outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800"
      onClick={onClick}
      tabIndex={0}
    >
      {children}
    </button>
  );
};
