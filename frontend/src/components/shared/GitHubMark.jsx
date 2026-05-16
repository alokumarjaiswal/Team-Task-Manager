export default function GitHubMark({ width = 18, height = 18, ...props }) {
  return (
    <img
      src="/favicon/favicon.svg"
      width={width}
      height={height}
      alt="Team Task Manager"
      aria-hidden="true"
      draggable="false"
      {...props}
    />
  );
}
