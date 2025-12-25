const IconBtn = ({ icon, onClick }: { icon: React.ReactNode, onClick: () => void }) => {
  return (
    <div 
      className="flex gap-1 h-8 items-center justify-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md px-1 py-0.5" 
      onClick={onClick}
    >
      {icon}
    </div>
  );
};

export default IconBtn;