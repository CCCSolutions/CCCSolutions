import axios from 'axios';
import Post from '../components/Post.jsx';

const Thread = ({forumid, title}) => {
  const [thread, setThread] = useState([]);

  useEffect(() => { 
    axios.get(`http://localhost:8000/thread/${forumid}`)
      .then(response => setThreads(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        {thread.title}
      </h1>
      <p>
        {thread.description}
      </p>
      <div className="bg-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {thread.map(post => (
            <Post user={post.author.user} content={post.content} created_at={post.created_at} contributions={post.author.contributions} username_color={post.author.username_color}/>
          ))}
      </div>
    </div>
  );
};

export default Thread;
