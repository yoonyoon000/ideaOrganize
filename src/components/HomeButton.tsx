type HomeButtonProps = {
  href: string;
  onClick: () => void;
};

export default function HomeButton({ href, onClick }: HomeButtonProps) {
  return (
    <a
      href={href}
      className="secondary-button home-button"
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      목록으로
    </a>
  );
}
