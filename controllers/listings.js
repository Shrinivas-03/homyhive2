const Listing=require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async (req,res) => {
    try {
        let { search, category, minPrice, maxPrice, guests, sortBy } = req.query;
        let filter = {};
        
        // Enhanced search functionality
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { location: searchRegex },
                { country: searchRegex },
                { 'owner.username': searchRegex }
            ];
        }
        
        // Category filter with predefined categories
        const validCategories = [
            'trending', 'rooms', 'iconic-cities', 'mountains', 'beaches', 
            'castles', 'pools', 'lakefront', 'countryside', 'camping',
            'cabins', 'farms', 'tiny-homes', 'treehouses', 'boats',
            'windmills', 'caves', 'domes', 'luxe', 'design', 'vineyards',
            'golfing', 'skiing', 'surfing', 'national-parks', 'desert',
            'arctic', 'tropical', 'historical'
        ];
        
        if (category && category !== '' && validCategories.includes(category)) {
            filter.category = category;
        }
        
        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice && !isNaN(minPrice)) filter.price.$gte = parseInt(minPrice);
            if (maxPrice && !isNaN(maxPrice)) filter.price.$lte = parseInt(maxPrice);
        }
        
        // Guest capacity filter
        if (guests && !isNaN(guests)) {
            filter.guests = { $gte: parseInt(guests) };
        }
        
        // Sorting options
        let sortOptions = {};
        switch(sortBy) {
            case 'price-low':
                sortOptions = { price: 1 };
                break;
            case 'price-high':
                sortOptions = { price: -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'rating':
                sortOptions = { averageRating: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }
        
        const allListings = await Listing.find(filter)
            .populate('owner')
            .populate('reviews')
            .sort(sortOptions);
        
        // Get category counts for filters
        const categoryCounts = await Listing.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Get price statistics
        const priceStats = await Listing.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    avgPrice: { $avg: '$price' }
                }
            }
        ]);
        
        // Get popular locations
        const popularLocations = await Listing.aggregate([
            { $group: { _id: '$location', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        res.render("listings/index.ejs", {
            allListings,
            searchQuery: search || '',
            categoryCounts,
            priceStats: priceStats[0] || { minPrice: 0, maxPrice: 1000, avgPrice: 100 },
            popularLocations,
            filters: { category, minPrice, maxPrice, guests, sortBy },
            resultCount: allListings.length,
            validCategories
        });
    } catch (error) {
        console.error("Error in listings index:", error);
        req.flash("error", "Something went wrong while loading listings");
        res.render("listings/index.ejs", { allListings: [], searchQuery: '', categories: [], filters: {}, resultCount: 0 });
    }
};

module.exports.renderNewForm=(req, res) => {
    console.log(req.user);
    res.render("listings/new.ejs", { listing: { image: { url: "" } } });
};

module.exports.showListing=async (req,res) => {
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({path:"reviews",populate:{path:"author"},}).populate("owner");
    if(!listing) {
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing = async (req, res, next) => {
    try {
        console.log("Creating listing with data:", req.body.listing);
        
        let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        }).send();

        console.log("Mapbox response:", JSON.stringify(response.body, null, 2));

        if (!response.body.features.length) {
            throw new ExpressError("Invalid location provided", 400);
        }

        const { path: url, filename } = req.file;
        
        // Log the geometry from Mapbox
        const mapboxGeometry = response.body.features[0].geometry;
        console.log("Mapbox geometry:", mapboxGeometry);

        // Create geometry object
        const geometry = {
            type: "Point",
            coordinates: mapboxGeometry.coordinates
        };
        console.log("Created geometry object:", geometry);

        // Create the listing with all required fields
        const listingData = {
            ...req.body.listing,
            owner: req.user._id,
            image: { url, filename },
            geometry: geometry
        };
        console.log("Listing data before creation:", listingData);

        const newListing = new Listing(listingData);
        console.log("New listing object:", newListing);

        const savedListing = await newListing.save();
        console.log("Saved listing:", savedListing);
        
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Error creating listing:", err);
        next(err);
    }
};

module.exports.renderEditForm=async(req,res) => {
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing) {
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing=async(req,res) => {
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
    
    if(typeof req.file !=="undefined") {
      let url=req.file.path;
      let filename=req.file.filename;
      listing.image={url,filename};
      await listing.save();
    }
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing=async(req,res) => {
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
     req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};

// Search suggestions API for navbar autocomplete
module.exports.getSearchSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.length < 2) {
            return res.json([]);
        }
        
        // Get unique locations and cities from existing listings
        const locationSuggestions = await Listing.aggregate([
            {
                $match: {
                    $or: [
                        { location: { $regex: query, $options: 'i' } },
                        { country: { $regex: query, $options: 'i' } },
                        { title: { $regex: query, $options: 'i' } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    locations: { $addToSet: "$location" },
                    countries: { $addToSet: "$country" },
                    titles: { $addToSet: "$title" }
                }
            }
        ]);
        
        let suggestions = [];
        
        if (locationSuggestions.length > 0) {
            const data = locationSuggestions[0];
            
            // Add location suggestions
            data.locations.forEach(location => {
                if (location.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.push({
                        name: location,
                        type: 'location',
                        icon: 'fa-location-dot'
                    });
                }
            });
            
            // Add country suggestions
            data.countries.forEach(country => {
                if (country.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.push({
                        name: country,
                        type: 'country',
                        icon: 'fa-flag'
                    });
                }
            });
            
            // Add property suggestions
            data.titles.forEach(title => {
                if (title.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.push({
                        name: title,
                        type: 'property',
                        icon: 'fa-home'
                    });
                }
            });
        }
        
        // Add popular destinations if no matches found
        if (suggestions.length === 0) {
            const popularPlaces = [
                { name: 'Mumbai, Maharashtra', type: 'city', icon: 'fa-city' },
                { name: 'Delhi, India', type: 'city', icon: 'fa-city' },
                { name: 'Bangalore, Karnataka', type: 'city', icon: 'fa-city' },
                { name: 'Goa, India', type: 'state', icon: 'fa-umbrella-beach' },
                { name: 'Kerala, India', type: 'state', icon: 'fa-mountain' },
                { name: 'Rajasthan, India', type: 'state', icon: 'fa-mosque' }
            ];
            
            suggestions = popularPlaces.filter(place => 
                place.name.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        // Limit to 8 suggestions
        res.json(suggestions.slice(0, 8));
        
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.json([]);
    }
};

// Category statistics API
module.exports.categoryStats = async (req, res) => {
    try {
        const validCategories = [
            'trending', 'rooms', 'iconic-cities', 'mountains', 'beaches', 
            'castles', 'pools', 'lakefront', 'countryside', 'camping',
            'cabins', 'farms', 'tiny-homes', 'treehouses', 'boats',
            'windmills', 'caves', 'domes', 'luxe', 'design', 'vineyards',
            'golfing', 'skiing', 'surfing', 'national-parks', 'desert',
            'arctic', 'tropical', 'historical'
        ];
        
        const stats = await Listing.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Create stats for all valid categories, including those with 0 count
        const categoryStats = {};
        validCategories.forEach(category => {
            const found = stats.find(s => s._id === category);
            categoryStats[category] = found ? found.count : 0;
        });
        
        // Add total count
        const totalCount = await Listing.countDocuments();
        
        res.json({
            categories: categoryStats,
            totalProperties: totalCount,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Category stats error:', error);
        res.status(500).json({ error: 'Failed to fetch category statistics' });
    }
};

// Popular destinations API
module.exports.popularDestinations = async (req, res) => {
    try {
        const destinations = await Listing.aggregate([
            {
                $group: {
                    _id: {
                        location: '$location',
                        country: '$country'
                    },
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    sampleImage: { $first: '$image.url' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 12 },
            {
                $project: {
                    location: '$_id.location',
                    country: '$_id.country',
                    propertyCount: '$count',
                    avgPrice: { $round: ['$avgPrice', 2] },
                    image: '$sampleImage'
                }
            }
        ]);
        
        res.json(destinations);
    } catch (error) {
        console.error('Popular destinations error:', error);
        res.status(500).json([]);
    }
};