import { h } from "preact";
import { Suspense, lazy } from "preact/compat";

let SomeComponent = lazy(() => import("/src/components/something-else.js"));

const Fallback = () => <div>LOADING</div>;
export default (props) => {
  try {
    // if we're in node, this throws, thus the log is never reached
    // if we're in the browser, window exists, thus the log is never reached
    // we use this for the throw in the prebuild/node env
    if (!window) {
      console.log("this");
    }
    return (
      // note that this outer element can be mistaken for the
      // ssr'd wrapped if it is not sufficiently unique
      // (such as if they are both divs)
      // resulting in the SSR'd content sticking around
      <section>
        <Suspense fallback={<Fallback />}>
          {/*
             The Suspense content needs to be wrapped in a dom node
             (div in this case)
             or it will be out of order.
             possibly: https://github.com/preactjs/preact/issues/2747#issuecomment-699874181
          */}
          <div>
            {/*
              This h1 only shows up after the suspense component is 
              imported and rendered
             */}
            <h1>hi</h1>
            <SomeComponent />
          </div>
        </Suspense>
      </section>
    );
  } catch (e) {
    // This Fallback is only rendered on the server
    return <Fallback />;
  }
};
