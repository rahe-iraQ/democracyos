'use strict'

require('lib/models')()
const Topic = require('lib/models').Topic
const Forum = require('lib/models').Forum

function mapMigrate (model, fn) {
  return new Promise(function (resolve, reject) {
    model.find({}, function (err, items) {
      if (err) {
        console.log(err.message)
        return reject('get all ' + model.modelName + 's to migrate failed ')
      }
      Promise.all(items.map(fn)).then(resolve).catch(reject)
    })
  })
}

exports.up = function up (done) {
  mapMigrate(Topic, function (topic) {
    if (!topic.owner) {
      return new Promise(function (resolve, reject) {
        Forum
        .where({ _id: topic.forum })
        .findOne(function (err, forum) {
          if (err) return reject('get forum ' + topic.forum + ' error')
          if (!forum) {
            console.log('no forum with id ', topic.forum)
            return resolve(0)
          }

          topic.owner = forum.owner
          topic.save(function (err) {
            if (err) return reject('save topic ' + topic._id)
            return resolve(1)
          })
        })
      })
    } else {
      return Promise.resolve(0)
    }
  })
  .then(function (results) {
    console.log('add topics owner from ' + results.filter((v) => v).length + ' topics succeded')
    done()
  })
  .catch(function (err) {
    console.log('topic add owner failed at ', err)
    done()
  })
}

exports.down = function down (done) {
  mapMigrate(Topic, function (topic) {
    if (topic.owner) {
      return new Promise(function (resolve, reject) {
        var topicDoc = topic._doc //Object.assign({}, topic._doc)
        delete topicDoc.owner
        Topic.collection.findOneAndReplace({ _id: topicDoc._id }, topicDoc)
          .then(function (r) {
            resolve(1)
          })
          .catch(function (err) {
            console.log(err)
            reject('modify topic ' + topic._id + ' failed')
          })
      })
    } else {
      return Promise.resolve(0)
    }
  })
  .then(function (results) {
    console.log('remove topic owner from ' + results.filter((v) => v).length + ' topics succeded')
    done()
  })
  .catch(function (err) {
    console.log('topics remove owner failed at', err)
    done()
  })
}
