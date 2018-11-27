

declare var FS;         // used when does not exist a ts declaration file

let filesPath = Meteor.settings.public.collectionFS_path_templates;

export const CollectionFS_templates = new FS.Collection("collectionFS_templates", {
  stores: [new FS.Store.FileSystem("collectionFS_templates", { path: filesPath })],
  filter: {
    allow: {
      extensions: ['html','docx','xlsx']
    }
  }
});

if (Meteor.isServer) {
    CollectionFS_templates.allow({
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
