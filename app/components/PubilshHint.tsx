
import classnames from "classnames";

interface PublishHintProps {
  published: boolean;
  onClick?: () => void;
}

export default function PublishHint({ published, onClick }: PublishHintProps) {
  const clickable = !!onClick;
  return (
    <div className="flex items-center space-x-2">
      <span className={classnames(
        "px-2.5 py-0.5 text-xs font-medium rounded-full",
        published 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
        clickable && "cursor-pointer"
        )}
        onClick={onClick}
      >
        {published ? 'Published' : 'Draft'}
      </span>
    </div>
  );
}
