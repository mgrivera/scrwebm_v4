

declare var FS: any;         // used when does not exist a ts declaration file

// var dropBox_collectionFS_store = new FS.Store.Dropbox("collection_fs_templates", {
//   maxTries: 5 //optional, default 5
// })

let filesPath = Meteor.settings.public.collectionFS_path_templates;

export const CollectionFS_templates = new FS.Collection("collection_fs_templates", {
  stores: [new FS.Store.FileSystem("collectionFS_templates", { path: filesPath })],
})