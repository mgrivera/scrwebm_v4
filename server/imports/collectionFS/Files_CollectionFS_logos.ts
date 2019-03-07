
declare var FS: any;         // used when does not exist a ts declaration file

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

// siempre determinamos el mongo_url 
// aunque la aplicación no esté en Galaxy, agregamos este setting al file settings.json, para que pueda ser leído aquí ... 
// const mongo_url = Meteor.settings.public["galaxy.meteor.com"].env.MONGO_URL; 

// const logosStore = new FS.Store.GridFS("collection_fs_logos", {
//   mongoUrl: mongo_url, 
//   // mongoUrl: 'mongodb://127.0.0.1:27017/test/', // optional, defaults to Meteor's local MongoDB
//   // mongoOptions: {...},  // optional, see note below
//   // transformWrite: myTransformWriteFunction, //optional
//   // transformRead: myTransformReadFunction, //optional
//   maxTries: 5, // optional, default 5
//   chunkSize: 1024*1024  // optional, default GridFS chunk size in bytes (can be overridden per file).
//                         // Default: 2MB. Reasonable range: 512KB - 4MB
// });

// var dropBox_collectionFS_store = new FS.Store.Dropbox("collection_fs_logos", {
//   key: Meteor.settings.public.dropBox_appKey, 
//   secret: Meteor.settings.public.dropBox_appSecret,
//   token: Meteor.settings.public.dropBox_appToken,
//   folder: Meteor.settings.public.dropBox_appFolder, //optional, which folder (key prefix) to use 

//   // follows common collectionFS functions: 
  
//   // beforeWrite: function(fileObj) {
//   //   fileObj.size(20, {store: "avatarStoreSmall", save: false});
//   // },
//   // transformWrite: function(fileObj, readStream, writeStream) {
//   //   gm(readStream, fileObj.name()).resize('20', '20').stream().pipe(writeStream)
//   // }
//   maxTries: 5 //optional, default 5
// })

// Avatars = new FS.Collection("avatars", {
//   stores: [avatarStoreSmall, avatarStoreLarge],
//   filter: {
//     allow: {
//       contentTypes: ['image/*']
//     }
//   }
// })

// export const CollectionFS_logos = new FS.Collection("collection_fs_logos", {
//   stores: [dropBox_collectionFS_store],
//   filter: {
//     allow: {
//       contentTypes: ['image/*']
//     }
//   }
// });


// if (Meteor.isServer) {
//     CollectionFS_logos.allow({
//     insert: function (userId: string) {
//       return (userId ? true : false);
//     },
//     remove: function (userId: string) {
//       return (userId ? true : false);
//     },
//     download: function () {
//       return true;
//     },
//     update: function (userId: string) {
//       return (userId ? true : false);
//     }
//   });
// };
