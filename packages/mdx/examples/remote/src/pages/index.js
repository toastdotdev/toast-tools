import { h } from "preact";

export default (props) => (
  <div>
    <h1>a landing page</h1>
    <ul>
      {props.posts.map(({ meta }) => (
        <li>
          <a href={"/posts/" + meta.slug}>{meta.title}</a>
        </li>
      ))}
    </ul>
  </div>
);
