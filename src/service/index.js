import lcStore from './lcStore';

const Service = {
  url,
  lcStore
};

function register(serverName, map) {
  if (!Service[serverName]) {
    Service[serverName] = new TemplateService();
    Object.keys(map).forEach((key) => {
      if (typeof map[key] === 'function') {
        Service[serverName][key] = map[key].bind(Service[serverName]);
      } else {
        Service[serverName][key] = map[key];
      }
    });
  }
}

@httpRequest
class TemplateService {}

export default Service;
