
declare var FS;         // used when does not exist a ts declaration file

let filesPath = Meteor.settings.public.collectionFS_path_logos;

export const CollectionFS_logos = new FS.Collection("collectionFS_logos", {
  stores: [new FS.Store.FileSystem("collectionFS_logos", { path: filesPath })],
  filter: {
    allow: {
      contentTypes: [ 'image/*' ],
      extensions: [ 'jpg', 'png', 'jpeg' ]
    }
  }
});

if (Meteor.isServer) {
    CollectionFS_logos.allow({
    insert: function (userId) {
      return (userId ? true : false);
    },
    remove: function (userId) {
      return (userId ? true : false);
    },
    download: function () {
      return true;
    },
    update: function (userId) {
      return (userId ? true : false);
    }
  });
};
