const { Router } = require('express');
const multer = require('multer');
const path = require("path");

const Blog = require("../models/blog")
const Comment = require("../models/comment");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`
    cb(null, filename);
  },
})

const upload = multer({ storage: storage })

router.get('/add-new', (req,res)=>{
    return res.render('AddBlog',{
        user: req.user,
    });
});

router.get('/:id', async (req,res)=>{
    const blog = await Blog.findById(req.params.id).populate('createdBy');
    const comments = await Comment.find({ blogId: req.params.id }).populate('createdBy')  
    console.log("comments", comments)
    return res.render('blog', {
        user: req.user, 
        blog,
        comments,
    })
});

router.post('/comment/:blogId', async (req, res) => {
    const { content } = req.body;
    const blogId = req.params.blogId;

    if (!content || content.trim() === "") {
        // Optional: you can fetch blog and comments again to re-render the blog page
        const blog = await Blog.findById(blogId).populate('createdBy');
        const comments = await Comment.find({ blogId }).populate('createdBy');
        return res.render('blog', {
            user: req.user,
            blog,
            comments,
            error: 'Comment content is required.'
        });
    }

    try {
        await Comment.create({
            content: content.trim(),
            blogId,
            createdBy: req.user._id,
        });
        return res.redirect(`/blog/${blogId}`);
    } catch (err) {
        console.error("Comment creation failed:", err.message);
        return res.status(500).send("Internal Server Error");
    }
});


router.post('/', upload.single('coverImage'), async (req,res)=>{
    const { title, body } =  req.body
    const blog = await Blog.create({
        body,       
        title,
        createdBy : req.user._id,
        coverImageURL : `/uploads/${req.file.filename }`,
    });
    return res.redirect(`/blog/${blog._id}`);
});
module.exports = router;