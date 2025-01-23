
import classnames from "classnames";

interface PublishHintProps {
  published: boolean;
  onClick?: () => void;
}

export default function PublishHint({ published, onClick }: PublishHintProps) {
  return (
    <div className="flex items-center space-x-2 pl-2 border-l border-gray-200 dark:border-gray-700">
      <span className={classnames(
        "px-2.5 py-0.5 text-xs font-medium rounded-full cursor-pointer",
        published 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        )}
        onClick={onClick}
      >
        {published ? 'Published' : 'Draft'}
      </span>
    </div>
  );
}
