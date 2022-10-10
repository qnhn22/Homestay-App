const express = require("express")
const app = express()
const path = require("path")
const mongoose = require("mongoose")
const Homestay = require("./models/homestay")
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const { ppid } = require("process")
const ExpressError = require("./utils/ExpressError")
const Review = require("./models/review")

mongoose.connect('mongodb://localhost:27017/homestay-rating', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Mongo Connection Open!!!")
    }).catch(err => {
        console.log("Mongo error!!!")
        console.log(err)
    })

app.engine('ejs', ejsMate)
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));

app.get("/", (req, res) => {
    res.render("home")
})

app.get("/homestays", async (req, res) => {
    const homestays = await Homestay.find({})
    res.render("homestays/index", { homestays })
})

app.get("/homestays/new", (req, res) => {
    res.render("homestays/new")
})

app.get("/homestays/:id", async (req, res, next) => {
    try {
        const { id } = req.params
        const homestay = await Homestay.findById(id).populate("reviews")
        res.render("homestays/show", { homestay })
    } catch (e) {
        next(e)
    }
})

app.get('/homestays/:id/edit', async (req, res, next) => {
    try {
        const homestay = await Homestay.findById(req.params.id)
        res.render('homestays/edit', { homestay });
    } catch (e) {
        next(e)
    }
})

app.post("/homestays", async (req, res) => {
    if (!req.body.homestay) {
        throw new ExpressError("Invalid Homestay Data", 400)
    }
    const homestay = new Homestay(req.body.homestay)
    await homestay.save()
    res.redirect(`homestays/${homestay._id}`)
})


app.put('/homestays/:id', async (req, res) => {
    const { id } = req.params;
    const homestay = await Homestay.findByIdAndUpdate(id, { ...req.body.homestay });
    res.redirect(`/homestays/${homestay._id}`)
})

app.delete('/homestays/:id', async (req, res) => {
    const { id } = req.params;
    await Homestay.findByIdAndDelete(id)
    res.redirect('/homestays')
})

app.post('/homestays/:id/reviews', async (req, res) => {
    const homestay = await Homestay.findById(req.params.id);
    const review = new Review(req.body.review)
    homestay.reviews.push(review);
    await review.save();
    await homestay.save();
    console.log(review)
    res.redirect(`/homestays/${homestay._id}`)
})

app.delete('/homestays/:id/reviews/:reviewId', async (req, res) => {
    const { id, reviewId } = req.params;
    await Homestay.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/homestays/${id}`)
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    res.status(statusCode).render('error', { err })
})
app.listen(8080, () => {
    console.log("Serving on port 8080!")
})