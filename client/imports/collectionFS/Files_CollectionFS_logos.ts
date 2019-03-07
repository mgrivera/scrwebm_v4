
declare var FS: any;         // used when does not exist a ts declaration file

// var dropBox_collectionFS_store = new FS.Store.Dropbox("collection_fs_logos", {
//   maxTries: 5 //optional, default 5
// })

let filesPath = Meteor.settings.public.collectionFS_path_logos;

export const CollectionFS_logos = new FS.Collection("collection_fs_logos", {
  stores: [new FS.Store.FileSystem("collectionFS_logos", { path: filesPath })],
  filter: {
    allow: {
      contentTypes: ['image/*']
    }
  }
});
