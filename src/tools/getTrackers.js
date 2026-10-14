import getTrackersJson from "./getTrackersJson";
import loadLocalTrackerModule from "./loadLocalTrackerModule";
import getLogger from "./getLogger";
import TrackerStore from "../stores/TrackerStore";
import {destroy} from "mobx-state-tree";
import storageGet from "./storageGet";
import storageSet from "./storageSet";
import removedTrackerIds from "./removedTrackerIds";
import {isBuiltInTrackerUrl} from "./builtInModules";

const compareVersions = require('compare-versions');

const logger = getLogger('getTrackers');

const getTrackers = () => {
  return Promise.all([
    getTrackersJson(),
    storageGet({trackers: {}}).then(storage => storage.trackers)
  ]).then(([idLocalVersion, idTracker]) => {
    let storageChanged = false;
    // удалённые встроенные трекеры убираем из кэша; свои трекеры с тем же id не трогаем
    removedTrackerIds.forEach(id => {
      const tracker = idTracker[id];
      if (tracker && isBuiltInTrackerUrl(tracker.meta && tracker.meta.downloadURL)) {
        delete idTracker[id];
        storageChanged = true;
      }
    });
    const ids = Object.keys(idLocalVersion).concat(Object.keys(idTracker));
    const idsUnic = ids.filter((id, index) => ids.indexOf(id) === index);
    return Promise.all(idsUnic.map(id => {
      let tracker = idTracker[id];
      const options = Object.assign({}, tracker && tracker.options);

      const localVersion = idLocalVersion[id];
      if (localVersion && tracker) {
        let localIsHigher = true;
        try {
          localIsHigher = compareVersions(localVersion, tracker.meta.version) > 0;
        } catch (err) {
          logger.error('compareVersions error', id, err);
        }
        if (localIsHigher) {
          tracker = null;
          delete idTracker[id];
        }
      }

      if (!tracker) {
        return loadLocalTrackerModule(id).then(localTracker => {
          localTracker.options = options;
          const trackerStore = TrackerStore.create(localTracker);
          const tracker = trackerStore.toJSON();
          destroy(trackerStore);

          storageChanged = true;
          return idTracker[id] = tracker;
        }, err => {
          logger.error('loadLocalTrackerModule error', id, err);
        });
      }
    })).then(() => {
      if (storageChanged) {
        return storageSet({trackers: idTracker}).then(() => idTracker);
      } else {
        return idTracker;
      }
    });
  });
};

export default getTrackers;