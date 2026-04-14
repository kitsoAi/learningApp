type Props = {
  children: React.ReactNode;
};

const LessonLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col h-full overflow-x-hidden">
      <div className="flex flex-col h-full w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};

export default LessonLayout;
