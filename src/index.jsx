import '@babel/polyfill';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/application.css';
import 'material-design-icons';
import gon from 'gon';
import faker from 'faker';
import cookies from 'js-cookie';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import io from 'socket.io-client';
import App from './components/App.jsx';
import reducers from './reducers';
import UsernameContext from './utils/UsernameContext';
import * as actions from './actions';

/* eslint-disable no-underscore-dangle */
const ext = window.__REDUX_DEVTOOLS_EXTENSION__;
const devtoolMiddleware = ext && ext();
/* eslint-enable */

if (!cookies.get('username')) {
  const randomName = faker.name.findName();
  cookies.set('username', randomName);
}

const store = createStore(
  reducers,
  (ext
    ? compose(applyMiddleware(thunk), devtoolMiddleware)
    : applyMiddleware(thunk)),
);

const initValues = ({ channels, messages, currentChannelId }) => {
  channels.forEach(channel => (
    store.dispatch(actions.addChannelSuccess({ channel }))
  ));
  messages.forEach(message => (
    store.dispatch(actions.addMessageSuccess({ message }))
  ));
  store.dispatch(actions.setActiveChannel({ activeChannel: currentChannelId }));
};

initValues(gon);

const mappingListener = (event, serverData) => {
  const mapping = {
    newMessage: data => actions.addMessageSuccess({ message: data }),
    newChannel: data => actions.addChannelSuccess({ channel: data }),
    removeChannel: data => actions.removeChannelSuccess({ id: data }),
    renameChanel: data => actions.renameChannelSuccess({ channel: data }),
  };
  return store.dispatch(mapping[event](serverData));
};

io()
  .on('newMessage', ({ data: { attributes } }) => mappingListener('newMessage', attributes))
  .on('newChannel', ({ data: { attributes } }) => mappingListener('newChannel', attributes))
  .on('removeChannel', ({ data: { id } }) => mappingListener('removeChannel', id))
  .on('renameChannel', ({ data: { attributes } }) => mappingListener('removeChannel', attributes));

ReactDOM.render(
  <Provider store={store}>
    <UsernameContext.Provider value={cookies.get('username')}>
      <App />
    </UsernameContext.Provider>
  </Provider>,
  document.getElementById('chat'),
);
