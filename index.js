const _ = {}
_.has = require('lodash/has');
_.includes = require('lodash/includes');
_.intersection = require('lodash/intersection');
_.isArray = require('lodash/isArray');
_.isNil = require('lodash/isNil');

function addObjectIdToConstraintOfFacetIndex(o_id, constraint, facet_index) {
    if(! _.has(facet_index, constraint)) {
        facet_index[constraint] = []
    }
    if(! _.includes(facet_index[constraint]), o_id) {
        facet_index[constraint].push(o_id)
    }  
}

function deep_index(o_id, facet_index, root, path) {
    if(! _.has(root, path[0])) { return } // property does not exist ? => exit
    if(root[path[0]] === null) { return } // do not index property with null value


    if(path.length == 1) {
        addObjectIdToConstraintOfFacetIndex(o_id, root[path[0]], facet_index);
        return;
    }

    if(_.isArray(root[path[0]])) {
        for(new_root of root[path[0]]) {
            deep_index(o_id, facet_index, new_root, path.slice(1));
        }
    } else {
        deep_index(o_id, facet_index, root[path[0]], path.slice(1));
    }
}

function build_facets_index(data, config) {
    // TODO check config validity, for instance if there is an id, otherwise log & exit
    const index = {}
    for (let facet of config.facets) {
        index[facet.name] = {};

        for(let d of data) {
            const o_id = d[config.id]; // unique key of the object to index
            path = facet.path.split('.');

            deep_index(o_id, index[facet.name], d, path);
        }
    }

    return index;
}

function search_facets(config, data, index, query) {
    let results = data.map(d => d[config.id]);

    for (fc of query.facet_constraints) {
        if (_.has(index, fc.facet) 
         && _.has(index[fc.facet], fc.constraint)
         && !_.isNil(index[fc.facet][fc.constraint])) {
           results = _.intersection(results, index[fc.facet][fc.constraint]);
        }
    }
    return results;
}


module.exports = {
    build_facets_index,
    search_facets
}