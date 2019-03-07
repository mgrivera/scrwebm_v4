

declare var FS: any;         // used when does not exist a ts declaration file

// var dropBox_collectionFS_store = new FS.Store.Dropbox("collection_fs_tempFiles", {
//   maxTries: 5 //optional, default 5
// })

let filesPath = Meteor.settings.public.collectionFS_path_tempFiles;

export const CollectionFS_tempFiles = new FS.Collection("collection_fs_tempFiles", {
  stores: [new FS.Store.FileSystem("collectionFS_tempFiles", { path: filesPath })],
});