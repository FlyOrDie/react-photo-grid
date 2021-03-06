'use strict';

var _ = require('lodash');
var React = require('react');

// TODO - element resize event is not working
var imageElements = [];

function imageLoadCallback(id, callback) {
    return function (e) {
        callback(id, this.naturalWidth, this.naturalHeight);
    };
}

function getImageDimensions(src, id, cb) {
    var img = new Image();
    img.id = id;
    imageElements.push(img);
    img.addEventListener('load', imageLoadCallback(id, cb));

    img.src = src;
}

var ImageGrid = React.createClass({
    displayName: 'ImageGrid',

    propTypes: {
        data: React.PropTypes.array.isRequired,
        gridSize: React.PropTypes.string,
        onImageClick: React.PropTypes.func
    },
    getInitialState: function getInitialState() {
        var containerWidth = 500,
            containerHeight = 500;

        if (this.props.gridSize) {
            var container = this.props.gridSize.split('x');
            containerWidth = container[0] || 500;
            containerHeight = container[1] || 500;
        }

        var imageData = this.props.data.length <= 4 ? this.props.data : _.first(this.props.data, 4);

        // take care of variations in property data
        // if someone just passes an array of path strings
        if (imageData[0] && _.isString(imageData[0])) {
            imageData = _.map(imageData, function (imagePath) {
                return {
                    id: Math.random() * 1000,
                    path: imagePath
                };
            });
        } else if (imageData[0] && _.isObject(imageData[0])) {
            imageData = _.map(imageData, function (image) {
                return _.defaults(image, {
                    id: Math.random() * 1000,
                    path: image.src // in case someone supplies a src property instead of path
                });
            });
        }

        var state = {
            // ladyLuck: 0,
            ladyLuck: Math.floor(Math.random() * 2),
            containerWidth: containerWidth,
            containerHeight: containerHeight,
            imagesToShow: imageData
        };

        if (this.props.containerWidth) {
            state.containerWidth = this.props.containerWidth;
        }

        return state;
    },
    getDefaultProps: function getDefaultProps() {
        return {
            data: []
        };
    },
    componentWillUnmount: function componentWillUnmount() {
        _.each(imageElements, function (imageElement) {
            imageElement.removeEventListener('load', imageLoadCallback(imageElement.id, this.recalculateGrid));
        });
    },
    componentDidMount: function componentDidMount() {
        _.each(this.state.imagesToShow, function (image, index) {
            getImageDimensions(image.path, image.id, this.recalculateGrid);
        }, this);

        // only set it to parents width/height if no gridsize is provided
        if (!this.props.gridSize) {
            this.setState({
                containerWidth: this.getDOMNode().offsetWidth,
                containerHeight: this.getDOMNode().offsetWidth
            });
        }

        // $(this.getDOMNode()).resize(this.onResize);
        // elementResizeEvent(this.getDOMNode(), this.onResize);
    },
    // Throttle updates to 60 FPS.
    onResize: _.throttle(function () {
        this.setState({
            containerWidth: this.getDOMNode().offsetWidth,
            containerHeight: this.getDOMNode().offsetWidth
        });
    }, 16.666),
    handleImageClick: function handleImageClick(imageId, event) {
        this.props.onImageClick && this.props.onImageClick(imageId);
    },
    recalculateGrid: function recalculateGrid(id, width, height) {
        var _imagesToShow = _.clone(this.state.imagesToShow);

        var imageIndex = _.findIndex(_imagesToShow, { id: id });
        _imagesToShow[imageIndex].width = width;
        _imagesToShow[imageIndex].height = height;
        var indexForMaxDimensionImage = 0;
        var container = {
            width: this.state.containerWidth,
            height: this.state.containerHeight
        };

        var contenders = ['Width', 'Height'];
        var winner = contenders[this.state.ladyLuck].toLowerCase();
        var loser = _.first(_.without(contenders, contenders[this.state.ladyLuck])).toLowerCase();

        // if all the images have width and height, we can rotate the array around the image with max height,
        // so that the first image has the max height and can be displayed properly on the left side
        if (_.all(_imagesToShow, function (image) {
            return image.width && image.height;
        })) {
            // TODO - the logic should not only look the the image with max height but with height >= containerHeight and max(height/width ratio)

            indexForMaxDimensionImage = _.findIndex(_imagesToShow, _.max(_imagesToShow, function (image) {
                return image[winner];
            }));

            if (_imagesToShow[indexForMaxDimensionImage][winner] < container[winner]) {
                container[winner] = _imagesToShow[indexForMaxDimensionImage][winner];
            }

            var indexForBestMaxImage = _.reduce(_imagesToShow, function (result, image, index) {
                if (image[winner] >= container[winner] && image[winner] / image[loser] > _imagesToShow[result][winner] / _imagesToShow[result][loser]) {
                    return index;
                }
                return result;
            }, 0);

            _imagesToShow.push.apply(_imagesToShow, _imagesToShow.splice(0, indexForBestMaxImage));
            this.setState({
                imagesToShow: _imagesToShow,
                containerHeight: container.height,
                containerWidth: container.width
            });
        }
    },
    getComponentStyles: function getComponentStyles(images) {
        var numberOfImages = images.length;

        var marginSetters = ['Bottom', 'Right'];
        var contenders = ['Width', 'Height'];
        var winner = contenders[this.state.ladyLuck];
        var loser = _.first(_.without(contenders, winner));
        var marginWinner = marginSetters[this.state.ladyLuck];
        var marginLoser = _.first(_.without(marginSetters, marginWinner));

        var smallestDimensionRaw = Math.floor(this.state['container' + winner] / (numberOfImages - 1));
        var margin = 2;
        var smallImageDimension = smallestDimensionRaw - margin;
        var styles = [];
        var commonStyle = {
            display: 'inline-block',
            position: 'relative',
            overflow: 'hidden',
            float: 'left',
            verticalAlign: 'top',
            cursor: 'pointer'
        };

        switch (numberOfImages) {
            case 0:
                break;
            case 1:
                // set some big numbers in case width and height not provided
                if (!images[0].width) images[0].width = 1000000;
                if (!images[0].height) images[0].height = 1000000;

                if (images[0].width > images[0].height) {
                    styles = [{
                        width: Math.min(this.state.containerWidth, images[0].width) - margin,
                        height: Math.min(this.state.containerWidth, images[0].width) * images[0].height / images[0].width - margin,
                        margin: margin
                    }];
                } else {
                    styles = [{
                        width: Math.min(this.state.containerHeight, images[0].height) * images[0].width / images[0].height - margin,
                        height: Math.min(this.state.containerHeight, images[0].height) - margin,
                        margin: margin
                    }];
                }
                break;
            case 2:
                styles[0] = styles[1] = {};

                styles[0][winner.toLowerCase()] = styles[1][winner.toLowerCase()] = this.state['container' + winner] - margin;
                styles[0][loser.toLowerCase()] = styles[1][loser.toLowerCase()] = Math.min(smallImageDimension / 2) - margin;
                styles[0]['margin' + marginWinner] = margin;
                break;
            default:
                styles[0] = {};
                styles[0][winner.toLowerCase()] = this.state['container' + winner];
                styles[0][loser.toLowerCase()] = smallImageDimension * (numberOfImages - 2);
                styles[0]['margin' + marginWinner] = margin;
                var styleForSmallerImages = {
                    width: smallImageDimension,
                    height: smallImageDimension
                };
                styleForSmallerImages['margin' + marginLoser] = margin;

                for (var i = 1; i < numberOfImages && i < 4; i++) {
                    // cloning is important here because otherwise changing the dimension of last image changes it for everyone
                    styles.push(_.clone(styleForSmallerImages));
                }

                // adjust the width/height of the last image in case of round off errors in division
                styles[numberOfImages - 1][winner.toLowerCase()] += styles[0][winner.toLowerCase()] - smallImageDimension * (numberOfImages - 1) - margin * (numberOfImages - 2);
                styles[numberOfImages - 1]['margin' + marginLoser] = 0;
        }

        return _.map(styles, function (style) {
            return _.defaults(style, commonStyle);
        });;
    },
    render: function render() {
        var componentStyles = this.getComponentStyles(this.state.imagesToShow);

        var images = this.state.imagesToShow.map(function (image, index) {
            var componentStyle = componentStyles[index];

            // max width and height has to be dynamic depending on this image's dimensions
            var imageStyle;

            if (image.width && image.height) {
                if (image.width <= componentStyle.width || image.height <= componentStyle.height) {
                    // do nothing
                } else if (image.width / componentStyle.width < image.height / componentStyle.height) {
                    imageStyle = {
                        maxWidth: componentStyle.width
                    };
                } else {
                    imageStyle = {
                        maxHeight: componentStyle.height
                    };
                }
            }

            return React.createElement(
                'div',
                { key: 'image_' + index, style: componentStyle },
                React.createElement('img', {
                    style: imageStyle,
                    src: image.path,
                    onClick: this.handleImageClick.bind(this, image.id) })
            );
        }, this);

        var containerStyle = {
            width: this.state.containerWidth,
            height: this.state.containerWidth,
            backgroundColor: 'white'
        };
        // the outer div is needed so that container width can be recalculated based on the parent container width (which the outer div inherits
        // the div inside the outer div is assigned a width in the first render itself. so that doesn't work out while trying to reset container width
        return React.createElement(
            'div',
            null,
            React.createElement(
                'div',
                { style: containerStyle },
                images,
                React.createElement('div', { style: { 'clear': 'both' } })
            )
        );
    }
});

module.exports = ImageGrid;