export default function TaskComments({ comments = [], users = [] }) {
  return (
    <div className="task-panel__comments">
      {comments.length === 0 ? <p className="task-panel__empty">No comments yet.</p> : null}
      {comments.map((comment) => (
        <div key={comment._id} className="task-panel__comment">
          <div className="task-panel__comment-meta">{users.find((user) => String(user._id) === String(comment.userId))?.name || 'User'} · {new Date(comment.createdAt).toLocaleString()}</div>
          <div>{comment.text}</div>
        </div>
      ))}
    </div>
  );
}
